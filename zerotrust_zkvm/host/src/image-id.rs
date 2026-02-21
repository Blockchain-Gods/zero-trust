use hex::encode as hex_encode;
use methods::GUEST_ZEROTRUST_ZKVM_ID;
use zero_trust_host::digest_to_bytes;

fn main() {
    let bytes = digest_to_bytes(GUEST_ZEROTRUST_ZKVM_ID.into());
    println!("image_id: {}", hex_encode(bytes));
}
